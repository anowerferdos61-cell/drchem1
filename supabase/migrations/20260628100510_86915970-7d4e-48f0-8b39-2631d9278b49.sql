GRANT EXECUTE ON FUNCTION public.admin_grant_subscription(uuid, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_grant_subscription(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_grant_subscription(uuid, text) FROM public;