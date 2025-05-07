CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    age INTEGER,
    encoding FLOAT8[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
	age INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


delete from users where id = 2

select * from users
select * from attendance
drop table attendance
drop table users


delete from users