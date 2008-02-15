CREATE TABLE authors (
    id       int not null auto_increment primary key,
    login    varchar(20) not null unique,
    pass     varchar(100) not null,
    name     varchar(100) not null,
    email    varchar(100) not null unique,
    url      varchar(200),
    hash     varchar(100),
    approved int default 0,
    admin    int default 0
);

CREATE TABLE distributions (
    id           int not null auto_increment primary key,
    filename     varchar(100) not null unique,
    name         varchar(100),
    description text,
    version      varchar(20),
    cdate        varchar(15),
    checksum     varchar(60),
    srcdir       varchar(100),
    author       int not null references authors
);

CREATE TABLE distribution_tags (
    id           int not null auto_increment primary key,
    distribution int not null references distributions,
    tag          int not null references tags
);

CREATE TABLE tags (
    id       int not null auto_increment primary key,
    name     varchar(50) not null unique
);

CREATE TABLE namespaces (
    id           int not null auto_increment primary key,
    version      varchar(20),
    name         varchar(100),
    filename     varchar(100),
    distribution int not null references distributions
);

CREATE TABLE trusted_clients (
    id int not null auto_increment primary key,
    ip varchar(15) not null unique
);

CREATE TABLE seeds (
    id   int not null auto_increment primary key,
    seed varchar(35) not null unique,
    author int
);

create table user_agent (
    id   integer      not null primary key auto_increment,
    name varchar(250) not null unique
);

create table running_test (
    id            bigint    not null primary key auto_increment,
    user_agent    integer   not null references user_agent (id),
    distributions integer   not null references distributions (id),
    started_on    timestamp not null
);

create table smoke_test (
    id            bigint    not null primary key auto_increment,
    user_agent    integer   not null references user_agent (id),
    distributions integer   not null references distributions (id),
    success       tinyint   not null,
    ended_on      timestamp not null,
    started_on    timestamp not null,
    failure_text  text
);
