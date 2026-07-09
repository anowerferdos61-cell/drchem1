GRANT SELECT, INSERT, UPDATE, DELETE ON public.classes TO authenticated;
GRANT ALL ON public.classes TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_members TO authenticated;
GRANT ALL ON public.class_members TO service_role;

GRANT EXECUTE ON FUNCTION public.join_class(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.regenerate_class_code(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_class_code() TO authenticated;