-- Date inputs accept years of up to six digits: a student saved 12027-01-01 as the start of their availability
-- (2026-11-16), and the CV showed «ene de 12027». Their availability ends on 2027-09-20, so the intended year is 2027.
-- Every date of a profile must now fall between 1900 and 2100.

update public.students set available_from = '2027-01-01' where available_from = '12027-01-01';

alter table public.students
  add constraint students_dates_range check (
    (available_from is null or available_from between '1900-01-01' and '2100-12-31')
    and (available_until is null or available_until between '1900-01-01' and '2100-12-31')
    and (graduation_date is null or graduation_date between '1900-01-01' and '2100-12-31')
    and (practice_end_date is null or practice_end_date between '1900-01-01' and '2100-12-31')
  );

alter table public.student_private
  add constraint student_private_birth_date_range check (birth_date is null or birth_date between '1900-01-01' and '2100-12-31');
