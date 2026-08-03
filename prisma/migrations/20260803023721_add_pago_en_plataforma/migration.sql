-- AlterTable
ALTER TABLE "pagos" ADD COLUMN     "enPlataforma" BOOLEAN NOT NULL DEFAULT true;

-- Estos cobros fueron Direct Charges históricos: su dinero llegó a la cuenta
-- conectada del condominio, no al balance de plataforma.
UPDATE "pagos"
SET "enPlataforma" = false
WHERE "id" IN (
  'cmsb7ezl5000878gdp8wubsv4',
  'cmsbdpkta000918gdui659lxc'
)
  AND "tipoOperacion" = 'CARGO'
  AND "estado" = 'PAGADO';
