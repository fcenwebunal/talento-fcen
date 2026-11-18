-- 20261117000017 lost the doubled backslashes of its escape patterns. Same function with the patterns fixed.
-- Inside a bracket expression «[.» opens a collating element, so «[» goes last in the class.
create or replace function public.repair_name(p_name text, p_reference text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  v text := p_name;
  v_ref text;
  v_pattern text;
  v_match text[];
  v_pos int;
  v_prev text;
  i int;
begin
  if v is null then
    return null;
  end if;
  if v ~ 'Ã' then
    begin
      v := convert_from(convert_to(v, 'LATIN1'), 'UTF8');
    exception when others then
      v := p_name;
    end;
  end if;
  v := replace(v, 'ï¿½', U&'\FFFD');
  if strpos(v, U&'\FFFD') = 0 or p_reference is null then
    return v;
  end if;

  -- SIA names come in capitals and usually without accents: compare without vowel accents but keep Ñ
  v_ref := translate(p_reference, 'ÁÉÍÓÚÜáéíóúü', 'AEIOUUaeiouu');
  v_pattern := translate(v, 'ÁÉÍÓÚÜáéíóúü', 'AEIOUUaeiouu');
  v_pattern := regexp_replace(v_pattern, '([].^$*+?(){}|[\\])', '\\\1', 'g');
  v_pattern := regexp_replace(v_pattern, '\s+', '\\s+', 'g');
  v_pattern := replace(v_pattern, U&'\FFFD', '(.)');
  v_match := regexp_match(v_ref, '^\s*' || v_pattern || '\s*$', 'i');
  if v_match is null then
    return v;
  end if;

  for i in 1 .. array_length(v_match, 1) loop
    v_pos := strpos(v, U&'\FFFD');
    v_prev := case when v_pos > 1 then substr(v, v_pos - 1, 1) else '' end;
    v := overlay(v placing case when v_prev <> upper(v_prev) then lower(v_match[i]) else upper(v_match[i]) end from v_pos for 1);
  end loop;
  return v;
end;
$$;

revoke execute on function public.repair_name(text, text) from public, anon, authenticated;
