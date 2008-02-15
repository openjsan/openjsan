DROP TABLE IF EXISTS jsan_smoke.smoke_test;
DROP TABLE IF EXISTS jsan_smoke.running_test;
DROP TABLE IF EXISTS jsan_smoke.distributions;
DROP TABLE IF EXISTS jsan_smoke.user_agent;

CREATE TABLE jsan_smoke.user_agent (
    id   INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT
   ,name VARCHAR(250) NOT NULL UNIQUE
);

CREATE TABLE jsan_smoke.distributions (
    id       int not null auto_increment primary key,
    filename varchar(100) not null unique,
    name     varchar(100),
    version  varchar(20),
    cdate    varchar(15),
    checksum varchar(60)
);

CREATE TABLE jsan_smoke.running_test (
    id BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT
   ,user_agent INTEGER NOT NULL REFERENCES jsan_smoke.user_agent (id)
   ,distributions INTEGER NOT NULL REFERENCES jsan_smoke.distributions (id)
   ,started_on TIMESTAMP NOT NULL
);

CREATE TABLE jsan_smoke.smoke_test (
    id BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT
   ,user_agent INTEGER NOT NULL REFERENCES jsan_smoke.user_agent (id)
   ,distributions INTEGER NOT NULL REFERENCES jsan_smoke.distributions (id)
   ,success TINYINT NOT NULL
   ,ended_on TIMESTAMP NOT NULL
   ,started_on TIMESTAMP NOT NULL
   ,failure_text TEXT
);
