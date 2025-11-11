-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.administrative_regions (
  id integer NOT NULL,
  name character varying NOT NULL,
  name_en character varying NOT NULL,
  code_name character varying,
  code_name_en character varying,
  CONSTRAINT administrative_regions_pkey PRIMARY KEY (id)
);

CREATE TABLE public.administrative_units (
  id integer NOT NULL,
  full_name character varying,
  full_name_en character varying,
  short_name character varying,
  short_name_en character varying,
  code_name character varying,
  code_name_en character varying,
  CONSTRAINT administrative_units_pkey PRIMARY KEY (id)
);

CREATE TABLE public.categories (
  id text NOT NULL,
  name text NOT NULL,
  image_url text,
  created_at timestamp with time zone DEFAULT now(),
  order smallint,
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);

CREATE TABLE public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user1_id uuid NOT NULL,
  user2_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT conversations_pkey PRIMARY KEY (id),
  CONSTRAINT conversations_user1_id_fkey FOREIGN KEY (user1_id) REFERENCES auth.users(id),
  CONSTRAINT conversations_user2_id_fkey FOREIGN KEY (user2_id) REFERENCES auth.users(id)
);

CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  content text NOT NULL CHECK (char_length(content) > 0),
  sent_at timestamp with time zone DEFAULT now(),
  read_at timestamp with time zone,
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id),
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id)
);

CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['like'::text, 'new_message'::text])),
  from_user_id uuid,
  post_id uuid,
  is_read boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT notifications_from_user_id_fkey FOREIGN KEY (from_user_id) REFERENCES auth.users(id),
  CONSTRAINT notifications_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id)
);

CREATE TABLE public.posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  title text,
  price bigint,
  phone text,
  location text,
  description text,
  image_url text,
  is_active boolean,
  category text,
  province_code character varying DEFAULT ''::character varying,
  ward_code character varying DEFAULT ''::character varying,
  user_id uuid DEFAULT auth.uid(),
  status text,
  category_id text,
  subcategory_id text,
  province text,
  district text,
  CONSTRAINT posts_pkey PRIMARY KEY (id),
  CONSTRAINT posts_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id),
  CONSTRAINT posts_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES public.subcategories(id)
);

CREATE TABLE public.provinces (
  code character varying NOT NULL,
  name character varying NOT NULL,
  name_en character varying,
  full_name character varying NOT NULL,
  full_name_en character varying,
  code_name character varying,
  administrative_unit_id integer,
  CONSTRAINT provinces_pkey PRIMARY KEY (code),
  CONSTRAINT provinces_administrative_unit_id_fkey FOREIGN KEY (administrative_unit_id) REFERENCES public.administrative_units(id)
);

CREATE TABLE public.saved_posts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  post_id uuid NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT saved_posts_pkey PRIMARY KEY (id),
  CONSTRAINT saved_posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT saved_posts_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id)
);

CREATE TABLE public.subcategories (
  id text NOT NULL,
  name text NOT NULL,
  category_id text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT subcategories_pkey PRIMARY KEY (id),
  CONSTRAINT subcategories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);

CREATE TABLE public.user_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  full_name text,
  phone text,
  avatar_url text,
  rating numeric,
  total_sales bigint,
  cccd_front_url text,
  cccd_back_url text,
  is_verified boolean DEFAULT false,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_profiles_pkey PRIMARY KEY (id)
);

CREATE TABLE public.wards (
  code character varying NOT NULL,
  name character varying NOT NULL,
  name_en character varying,
  full_name character varying,
  full_name_en character varying,
  code_name character varying,
  province_code character varying,
  administrative_unit_id integer,
  CONSTRAINT wards_pkey PRIMARY KEY (code),
  CONSTRAINT wards_administrative_unit_id_fkey FOREIGN KEY (administrative_unit_id) REFERENCES public.administrative_units(id),
  CONSTRAINT wards_province_code_fkey FOREIGN KEY (province_code) REFERENCES public.provinces(code)
);