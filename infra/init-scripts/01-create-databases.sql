-- ============================================
-- VERITABANI OLUSTURMA SCRIPTI
-- Tum projeler icin veritabanlari
-- ============================================

-- Mail Generator / Uzman Mail Panel Database
CREATE DATABASE mailpanel;
CREATE USER mailpanel WITH ENCRYPTED PASSWORD 'mailpanel123';
GRANT ALL PRIVILEGES ON DATABASE mailpanel TO mailpanel;

-- Podcast App Database (eger kullaniliyorsa)
CREATE DATABASE podcast_app;
CREATE USER podcast WITH ENCRYPTED PASSWORD 'podcast123';
GRANT ALL PRIVILEGES ON DATABASE podcast_app TO podcast;

-- Tourism App Database (eger kullaniliyorsa)
CREATE DATABASE tourism_app;
CREATE USER tourism WITH ENCRYPTED PASSWORD 'tourism123';
GRANT ALL PRIVILEGES ON DATABASE tourism_app TO tourism;

-- Yetkileri guncelle
\c mailpanel
GRANT ALL ON SCHEMA public TO mailpanel;

\c podcast_app
GRANT ALL ON SCHEMA public TO podcast;

\c tourism_app
GRANT ALL ON SCHEMA public TO tourism;
