-- Atomic pass checkout: payment + usage + occasions_used in one transaction.
-- Invoker security so existing facility-scoped RLS on payments / pass_usages /
-- client_passes still applies. No SECURITY DEFINER precedent exists for RPCs.

CREATE OR REPLACE FUNCTION public.record_pass_payment(
  p_checkin_id uuid,
  p_booking_id uuid,
  p_facility_id uuid,
  p_service_type text,
  p_units integer,
  p_rate numeric,
  p_transport_fee numeric,
  p_food_fee numeric,
  p_surcharge_percent numeric,
  p_subtotal numeric,
  p_total numeric,
  p_recorded_by uuid,
  p_client_pass_id uuid,
  p_client_id uuid
)
RETURNS public.payments
LANGUAGE plpgsql
AS $$
DECLARE
  v_pass public.client_passes;
  v_payment public.payments;
BEGIN
  SELECT *
  INTO v_pass
  FROM public.client_passes
  WHERE id = p_client_pass_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'This pass does not belong to this client or facility.';
  END IF;

  IF v_pass.facility_id IS DISTINCT FROM p_facility_id
     OR v_pass.client_id IS DISTINCT FROM p_client_id THEN
    RAISE EXCEPTION 'This pass does not belong to this client or facility.';
  END IF;

  IF v_pass.status IS DISTINCT FROM 'active'
     OR v_pass.service_type IS DISTINCT FROM p_service_type
     OR v_pass.occasions_used >= v_pass.occasions_total
     OR v_pass.expiry_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'This pass cannot be used for this checkout.';
  END IF;

  INSERT INTO public.payments (
    checkin_id,
    booking_id,
    facility_id,
    service_type,
    units,
    rate,
    transport_fee,
    food_fee,
    surcharge_percent,
    subtotal,
    total,
    payment_method,
    recorded_by,
    client_pass_id
  )
  VALUES (
    p_checkin_id,
    p_booking_id,
    p_facility_id,
    p_service_type,
    p_units,
    p_rate,
    p_transport_fee,
    p_food_fee,
    p_surcharge_percent,
    p_subtotal,
    p_total,
    'pass',
    p_recorded_by,
    p_client_pass_id
  )
  RETURNING * INTO v_payment;

  INSERT INTO public.pass_usages (
    client_pass_id,
    payment_id,
    facility_id,
    units_consumed
  )
  VALUES (
    p_client_pass_id,
    v_payment.id,
    p_facility_id,
    1
  );

  UPDATE public.client_passes
  SET
    occasions_used = occasions_used + 1,
    status = CASE
      WHEN occasions_used + 1 >= occasions_total THEN 'exhausted'
      ELSE status
    END
  WHERE id = p_client_pass_id;

  RETURN v_payment;
END;
$$;

REVOKE ALL ON FUNCTION public.record_pass_payment(
  uuid, uuid, uuid, text, integer, numeric, numeric, numeric, numeric, numeric, numeric, uuid, uuid, uuid
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.record_pass_payment(
  uuid, uuid, uuid, text, integer, numeric, numeric, numeric, numeric, numeric, numeric, uuid, uuid, uuid
) TO authenticated;
