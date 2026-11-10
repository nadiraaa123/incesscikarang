#!/usr/bin/env bash
# Uji schema.sql pada PostgreSQL lokal kosong. Pakai: PGHOST=... PGPORT=... bash supabase/tests/jalankan.sh
set -euo pipefail
cd "$(dirname "$0")/.."
DB=rantang_uji_$$
psql -q -U postgres -c "create database $DB" >/dev/null
trap 'psql -q -U postgres -c "drop database $DB" >/dev/null' EXIT
psql -q -U postgres -d $DB -v ON_ERROR_STOP=1 -f tests/00_tiruan_supabase.sql >/dev/null
psql -q -U postgres -d $DB -v ON_ERROR_STOP=1 -f schema.sql 2>&1 | grep -v NOTICE || true
# jalankan dua kali: skema harus idempoten (aman dijalankan ulang)
psql -q -U postgres -d $DB -v ON_ERROR_STOP=1 -f schema.sql 2>&1 | grep -v NOTICE || true
psql -q -U postgres -d $DB -v ON_ERROR_STOP=1 -c "select 1 from laporan limit 0" >/dev/null
psql -q -U postgres -d $DB -v ON_ERROR_STOP=1 -f seed.sql >/dev/null
psql -q -U postgres -d $DB -v ON_ERROR_STOP=1 -f tests/01_uji_rls_alur.sql
