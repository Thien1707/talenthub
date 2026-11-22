ALTER TABLE student_profiles
  ADD COLUMN district VARCHAR(100) NULL,
  ADD COLUMN ward VARCHAR(100) NULL,
  ADD COLUMN province VARCHAR(100) NULL,
  ADD COLUMN preferred_address VARCHAR(255) NULL,
  ADD COLUMN preferred_province VARCHAR(100) NULL,
  ADD COLUMN preferred_district VARCHAR(100) NULL,
  ADD COLUMN preferred_ward VARCHAR(100) NULL,
  ADD COLUMN work_schedule_type ENUM('PART_TIME', 'FULL_TIME') NULL,
  ADD COLUMN available_from_date DATE NULL;

ALTER TABLE jobs
  ADD COLUMN province VARCHAR(100) NULL,
  ADD COLUMN district VARCHAR(100) NULL,
  ADD COLUMN ward VARCHAR(100) NULL,
  ADD COLUMN street_address VARCHAR(255) NULL,
  ADD COLUMN detail_address VARCHAR(255) NULL,
  ADD COLUMN work_schedule_type ENUM('PART_TIME', 'FULL_TIME') NULL;

CREATE TABLE job_work_schedules (
  schedule_id BIGINT NOT NULL AUTO_INCREMENT,
  job_id BIGINT NOT NULL,
  day_of_week ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY') NOT NULL,
  start_time VARCHAR(5) NOT NULL,
  end_time VARCHAR(5) NOT NULL,
  shift_name VARCHAR(50) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (schedule_id),
  INDEX idx_job_schedule_job_day (job_id, day_of_week),
  CONSTRAINT fk_job_work_schedule_job FOREIGN KEY (job_id) REFERENCES jobs (job_id) ON DELETE CASCADE
);

CREATE TABLE student_availability (
  availability_id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  student_profile_id BIGINT NULL,
  day_of_week ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY') NOT NULL,
  start_time VARCHAR(5) NOT NULL,
  end_time VARCHAR(5) NOT NULL,
  work_schedule_type ENUM('PART_TIME', 'FULL_TIME') NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (availability_id),
  INDEX idx_student_availability_user_day (user_id, day_of_week),
  CONSTRAINT fk_student_availability_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
  CONSTRAINT fk_student_availability_student_profile FOREIGN KEY (student_profile_id) REFERENCES student_profiles (student_profile_id) ON DELETE SET NULL
);

CREATE INDEX idx_student_profiles_preferred_location ON student_profiles (preferred_province, preferred_ward);
CREATE INDEX idx_jobs_province_ward ON jobs (province, ward);
