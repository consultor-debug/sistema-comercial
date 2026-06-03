-- CreateEnum
CREATE TYPE "ContractEstado" AS ENUM ('BORRADOR', 'ACTIVO', 'FIRMADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "CuotaStatus" AS ENUM ('PENDIENTE', 'PAGADO', 'VENCIDO', 'PARCIAL');

-- AlterTable
ALTER TABLE "contracts" DROP COLUMN "cronograma",
DROP COLUMN "cuotas",
ADD COLUMN     "cliente_estado_civil" TEXT,
ADD COLUMN     "cuotas_num" INTEGER,
ADD COLUMN     "datos" JSONB,
ADD COLUMN     "descuento_aprobado_cargo" TEXT,
ADD COLUMN     "descuento_aprobado_por" TEXT,
ADD COLUMN     "descuento_nivel" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "descuento_pct" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "estado" "ContractEstado" NOT NULL DEFAULT 'BORRADOR',
ADD COLUMN     "fecha_firma" TIMESTAMP(3),
ADD COLUMN     "firmado_fisicamente" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lugar_firma" TEXT,
ADD COLUMN     "tasa_anual" DOUBLE PRECISION,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT NOW();

-- CreateTable
CREATE TABLE "cuotas" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "descripcion" TEXT,
    "monto" DOUBLE PRECISION NOT NULL,
    "fecha_venc" TIMESTAMP(3) NOT NULL,
    "fecha_pago" TIMESTAMP(3),
    "monto_pagado" DOUBLE PRECISION,
    "estado" "CuotaStatus" NOT NULL DEFAULT 'PENDIENTE',
    "metodo_pago" TEXT,
    "num_operacion" TEXT,
    "voucher_url" TEXT,
    "registrado_por_id" TEXT,
    "registrado_el" TIMESTAMP(3),

    CONSTRAINT "cuotas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_condiciones" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "descuento_contado_max" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "descuento_financ_max" DOUBLE PRECISION NOT NULL DEFAULT 3,
    "descuento_excep_max" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "tasa_default" DOUBLE PRECISION NOT NULL DEFAULT 8,
    "plazo_max" INTEGER NOT NULL DEFAULT 60,
    "inicial_min_pct" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "tiempo_aprob_seg" INTEGER NOT NULL DEFAULT 120,
    "aprobadores" JSONB NOT NULL DEFAULT '[]',
    "penalidad" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "lucro_cesante" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_condiciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cuotas_tenant_id_idx" ON "cuotas"("tenant_id");

-- CreateIndex
CREATE INDEX "cuotas_contract_id_idx" ON "cuotas"("contract_id");

-- CreateIndex
CREATE INDEX "cuotas_fecha_venc_idx" ON "cuotas"("fecha_venc");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_condiciones_tenant_id_key" ON "tenant_condiciones"("tenant_id");

-- AddForeignKey
ALTER TABLE "cuotas" ADD CONSTRAINT "cuotas_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuotas" ADD CONSTRAINT "cuotas_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuotas" ADD CONSTRAINT "cuotas_registrado_por_id_fkey" FOREIGN KEY ("registrado_por_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_condiciones" ADD CONSTRAINT "tenant_condiciones_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

