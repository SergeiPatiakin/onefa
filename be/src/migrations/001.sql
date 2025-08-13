create table totp_keys(
    id bigserial primary key,
    user_id text not null,
    name text not null,
    key text not null
);
create index totp_keys_user_id on totp_keys(user_id);

create table migrations(
    id bigint primary key,
    name text not null
);
