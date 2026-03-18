
CREATE TABLE public.адреса (
	id int4 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1 NO CYCLE) NOT NULL,
	пользователь_id int4 NOT NULL,
	адрес varchar(100) NOT NULL,
	CONSTRAINT адреса_pk PRIMARY KEY (id),
	CONSTRAINT адреса_пользователь_fk FOREIGN KEY (пользователь_id) REFERENCES public.пользователь(id)
);

CREATE TABLE public.доставки (
	id int4 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1 NO CYCLE) NOT NULL,
	заказ_id int4 NOT NULL,
	служба_доставки_id int4 NOT NULL,
	адрес_id int4 NOT NULL,
	дата_доставки date NOT NULL,
	CONSTRAINT доставки_pk PRIMARY KEY (id),
	CONSTRAINT доставки_адреса_fk FOREIGN KEY (адрес_id) REFERENCES public.адреса(id),
	CONSTRAINT доставки_заказы_fk FOREIGN KEY (заказ_id) REFERENCES public.заказы(id),
	CONSTRAINT доставки_службы_доставки_fk FOREIGN KEY (служба_доставки_id) REFERENCES public.службы_доставки(id)
);

CREATE TABLE public.заказы (
	id int4 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1 NO CYCLE) NOT NULL,
	пользователь_id int4 NOT NULL,
	дата_создания date NOT NULL,
	сумма numeric(12, 2) NOT NULL,
	CONSTRAINT заказы_pk PRIMARY KEY (id),
	CONSTRAINT заказы_пользователь_fk FOREIGN KEY (пользователь_id) REFERENCES public.пользователь(id)
);

CREATE TABLE public.избранное (
	id int4 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1 NO CYCLE) NOT NULL,
	пользователь_id int4 NOT NULL,
	товар_id int4 NOT NULL,
	CONSTRAINT избранное_pk PRIMARY KEY (id),
	CONSTRAINT избранное_пользователь_fk FOREIGN KEY (пользователь_id) REFERENCES public.пользователь(id),
	CONSTRAINT избранное_товары_fk FOREIGN KEY (товар_id) REFERENCES public.товары(id)
);

CREATE TABLE public.история_статусов_заказа (
	id int4 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1 NO CYCLE) NOT NULL,
	заказ_id int4 NOT NULL,
	статус_id int4 NOT NULL,
	дата_изменения date NOT NULL,
	CONSTRAINT история_статусов_заказа_pk PRIMARY KEY (id),
	CONSTRAINT история_статусов_заказа_заказы_fk FOREIGN KEY (заказ_id) REFERENCES public.заказы(id),
	CONSTRAINT история_статусов_заказа_статусы_з FOREIGN KEY (статус_id) REFERENCES public.статусы_заказов(id)
);

CREATE TABLE public.категории (
	id int4 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1 NO CYCLE) NOT NULL,
	название varchar(100) NOT NULL,
	родитель_id int4 NOT NULL,
	CONSTRAINT категории_pk PRIMARY KEY (id),
	CONSTRAINT категории_категории_fk FOREIGN KEY (родитель_id) REFERENCES public.категории(id)
);

CREATE TABLE public.корзина (
	id int4 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1 NO CYCLE) NOT NULL,
	товар_id int4 NOT NULL,
	пользователь_id int4 NOT NULL,
	CONSTRAINT корзина_pk PRIMARY KEY (id),
	CONSTRAINT корзина_пользователь_fk FOREIGN KEY (пользователь_id) REFERENCES public.пользователь(id),
	CONSTRAINT корзина_товары_fk FOREIGN KEY (товар_id) REFERENCES public.товары(id)
);

CREATE TABLE public.остатки_товаров (
	id int4 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1 NO CYCLE) NOT NULL,
	товар_id int4 NOT NULL,
	количество int4 NOT NULL,
	CONSTRAINT остатки_товаров_pk PRIMARY KEY (id),
	CONSTRAINT остатки_товаров_товары_fk FOREIGN KEY (товар_id) REFERENCES public.товары(id)
);


CREATE TABLE public.ответы_продавцов (
	id int4 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1 NO CYCLE) NOT NULL,
	отзыв_id int4 NOT NULL,
	продавец_id int4 NOT NULL,
	текст varchar(500) NOT NULL,
	дата_ответа date NOT NULL,
	CONSTRAINT ответы_продавцов_pk PRIMARY KEY (id),
	CONSTRAINT ответы_продавцов_отзывы_товаров_fk FOREIGN KEY (отзыв_id) REFERENCES public.отзывы_товаров(id),
	CONSTRAINT ответы_продавцов_продавцы_fk FOREIGN KEY (продавец_id) REFERENCES public.продавцы(id)
);


CREATE TABLE public.отзывы_товаров (
	id int4 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1 NO CYCLE) NOT NULL,
	товар_id int4 NOT NULL,
	пользователь_id int4 NOT NULL,
	оценка numeric(2, 1) NOT NULL,
	комментарий varchar(500) NOT NULL,
	дата_отзыва date NOT NULL,
	CONSTRAINT отзывы_товаров_pk PRIMARY KEY (id),
	CONSTRAINT отзывы_товаров_пользователь_fk FOREIGN KEY (пользователь_id) REFERENCES public.пользователь(id),
	CONSTRAINT отзывы_товаров_товары_fk FOREIGN KEY (товар_id) REFERENCES public.товары(id)
);


CREATE TABLE public.платежи (
	id int4 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1 NO CYCLE) NOT NULL,
	заказ_id int4 NOT NULL,
	способ_оплаты_id int4 NOT NULL,
	статусы_оплаты_id int4 NOT NULL,
	дата_оплаты date NOT NULL,
	CONSTRAINT платежи_pk PRIMARY KEY (id),
	CONSTRAINT платежи_заказы_fk FOREIGN KEY (заказ_id) REFERENCES public.заказы(id),
	CONSTRAINT платежи_способы_оплаты_fk FOREIGN KEY (способ_оплаты_id) REFERENCES public.способы_оплаты(id),
	CONSTRAINT платежи_статусы_оплаты_fk FOREIGN KEY (статусы_оплаты_id) REFERENCES public.статусы_оплаты(id)
);


CREATE TABLE public.позиции_заказ (
	id int4 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1 NO CYCLE) NOT NULL,
	заказ_id int4 NOT NULL,
	товар_id int4 NOT NULL,
	количество int4 NOT NULL,
	цена_на_момент_заказа numeric(10, 2) NOT NULL,
	CONSTRAINT позиции_заказ_pk PRIMARY KEY (id),
	CONSTRAINT позиции_заказ_заказы_fk FOREIGN KEY (заказ_id) REFERENCES public.заказы(id),
	CONSTRAINT позиции_заказ_товары_fk FOREIGN KEY (товар_id) REFERENCES public.товары(id)
);


CREATE TABLE public.пользователь (
	id int4 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1 NO CYCLE) NOT NULL,
	login varchar(100) NOT NULL,
	hash_pass varchar(100),
	CONSTRAINT пользователь_pk PRIMARY KEY (id)
);


CREATE TABLE public.продавцы (
	id int4 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1 NO CYCLE) NOT NULL,
	пользователь_id int4 NOT NULL,
	название_магазина varchar(100) NOT NULL,
	рейтинг numeric(2, 1) NOT NULL,
	CONSTRAINT продавцы_pk PRIMARY KEY (id),
	CONSTRAINT продавцы_пользователь_fk FOREIGN KEY (пользователь_id) REFERENCES public.пользователь(id)
);


CREATE TABLE public.профиль (
	id int4 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1 NO CYCLE) NOT NULL,
	фамилия varchar(100) NOT NULL,
	имя varchar(100) NOT NULL,
	отчество varchar(100) NULL,
	пользователь_id int4 NOT NULL,
	CONSTRAINT профиль_pk PRIMARY KEY (id),
	CONSTRAINT профиль_пользователь_fk FOREIGN KEY (пользователь_id) REFERENCES public.пользователь(id)
);


CREATE TABLE public.роли (
	id int4 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1 NO CYCLE) NOT NULL,
	название varchar(100) NOT NULL,
	CONSTRAINT роли_pk PRIMARY KEY (id)
);


CREATE TABLE public.роли_пользователи (
	id int4 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1 NO CYCLE) NOT NULL,
	роль_id int4 NOT NULL,
	пользователь_id int4 NOT NULL,
	CONSTRAINT роли_пользователи_pk PRIMARY KEY (id),
	CONSTRAINT роли_пользователи_пользователь_fk FOREIGN KEY (пользователь_id) REFERENCES public.пользователь(id),
	CONSTRAINT роли_пользователи_роли_fk FOREIGN KEY (роль_id) REFERENCES public.роли(id)
);


CREATE TABLE public.службы_доставки (
	id int4 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1 NO CYCLE) NOT NULL,
	название varchar(100) NOT NULL,
	CONSTRAINT службы_доставки_pk PRIMARY KEY (id)
);


CREATE TABLE public.способы_оплаты (
	id int4 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1 NO CYCLE) NOT NULL,
	название varchar(100) NOT NULL,
	CONSTRAINT способы_оплаты_pk PRIMARY KEY (id)
);


CREATE TABLE public.статусы_заказов (
	id int4 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1 NO CYCLE) NOT NULL,
	название varchar(100) NOT NULL,
	CONSTRAINT статусы_заказов_pk PRIMARY KEY (id)
);


CREATE TABLE public.статусы_оплаты (
	id int4 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1 NO CYCLE) NOT NULL,
	название varchar(100) NOT NULL,
	CONSTRAINT статусы_оплаты_pk PRIMARY KEY (id)
);


CREATE TABLE public.товары (
	id int4 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1 NO CYCLE) NOT NULL,
	продавец_id int4 NOT NULL,
	категории_id int4 NOT NULL,
	название varchar(100) NOT NULL,
	описание varchar(500) NOT NULL,
	активен bool NOT NULL,
	CONSTRAINT товары_pk PRIMARY KEY (id),
	CONSTRAINT товары_категории_fk FOREIGN KEY (категории_id) REFERENCES public.категории(id),
	CONSTRAINT товары_продавцы_fk FOREIGN KEY (продавец_id) REFERENCES public.продавцы(id)
);


CREATE TABLE public.характеристики (
	id int4 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1 NO CYCLE) NOT NULL,
	название varchar(100) NOT NULL,
	CONSTRAINT характеристики_pk PRIMARY KEY (id)
);

CREATE TABLE public.характеристики_товаров (
	id int4 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1 NO CYCLE) NOT NULL,
	характеристика_id int4 NOT NULL,
	значение varchar(100) NOT NULL,
	товар_id int4 NOT NULL,
	CONSTRAINT характеристики_товаров_pk PRIMARY KEY (id),
	CONSTRAINT характеристики_товаров_товары_fk FOREIGN KEY (товар_id) REFERENCES public.товары(id),
	CONSTRAINT характеристики_товаров_характери FOREIGN KEY (характеристика_id) REFERENCES public.характеристики(id)
);


CREATE TABLE public.цены_товаров (
	id int4 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1 NO CYCLE) NOT NULL,
	товар_id int4 NOT NULL,
	цена numeric(10, 2) NOT NULL,
	дата_начала date NOT NULL,
	дата_окончания date NULL,
	CONSTRAINT цены_товаров_pk PRIMARY KEY (id),
	CONSTRAINT цены_товаров_товары_fk FOREIGN KEY (товар_id) REFERENCES public.товары(id)
);

CREATE TABLE public.sso_user (
  id int4 GENERATED ALWAYS AS IDENTITY NOT NULL,
  auth_sys varchar NOT NULL,
  external_id varchar NOT NULL,
  user_id int4 NOT NULL,
  CONSTRAINT sso_user_pk PRIMARY KEY (id),
  CONSTRAINT sso_user_пользователь_fk FOREIGN KEY (user_id) REFERENCES public.пользователь(id)
);