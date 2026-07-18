'use client';

import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';

interface PricingPlan {
  name: string;
  priceMonthly: number;
  priceAnnual: number;
  description: string;
  subdescription: string;
  features: string[];
  isPopular?: boolean;
  buttonText: string;
}

const GARANTIA_ITEMS: string[] = [
  "Sin contrato de permanencia",
  "Cancela en cualquier momento",
  "Soporte incluido desde el día 1",
  "Activación en menos de 24 horas",
  "Todo lo anteriror aplica solo por la facturación mensual, en la facturación anual es diferente, para mas información consulte el FAQ"
];

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState<boolean>(true);

  const plans: PricingPlan[] = [
    {
      name: "Esencial",
      priceMonthly: 3500,
      priceAnnual: 3150,
      description: "Hasta 100 viviendas",
      subdescription: "Ideal para condominos pequeños",
      buttonText: "Contratar ahora →",
      features: [
        "Gestión de residentes",
        "Gestión de viviendas",
        "Comunicados y avisos",
        "Reservaciones de áreas comúnes",
        "Invitaciones y accesos",
        "Control administrativo",
        "Portal de residentes",
        "Soporte y actualizaciones"
      ]
    },
    {
      name: "Pro",
      priceMonthly: 6500,
      priceAnnual: 5850,
      description: "Hasta 101 a 300 viviendas",
      subdescription: "Para comunidades en crecimiento",
      isPopular: true,
      buttonText: "Contratar ahora →",
      features: [
        "Gestión de residentes",
        "Gestión de viviendas",
        "Comunicados y avisos",
        "Reservaciones de áreas comúnes",
        "Invitaciones y accesos",
        "Control administrativo",
        "Portal de residentes",
        "Soporte y actualizaciones"
      ]
    },
    {
      name: "Enterprise",
      priceMonthly: 12000,
      priceAnnual: 10800,
      description: "301 a 600 viviendas",
      subdescription: "Para desarrollos de gran escala",
      buttonText: "Contratar ahora →",
      features: [
        "Gestión de residentes",
        "Gestión de viviendas",
        "Comunicados y avisos",
        "Reservaciones de áreas comúnes",
        "Invitaciones y accesos",
        "Control administrativo",
        "Portal de residentes",
        "Soporte y actualizaciones"
      ]
    }
  ];

  return (
    <section id='precio' className="relative w-full bg-white py-20 md:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">

        {/* Encabezado Principal */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-gotham text-4xl md:text-5xl font-medium text-neutral-900 tracking-tight mb-4">
            Planes a la medida de tu comunidad
          </h2>
          <p className="font-gotham text-base md:text-lg text-neutral-500 font-light max-w-xl mx-auto">
            Elige el control operativo que tu condominio necesita. Sin plazos forzosos ni comisiones ocultas.
          </p>

          {/* Toggle de Facturación (Mensual / Anual) */}
          <div className="mt-10 flex items-center justify-center gap-4">
            <span className={`text-sm font-medium transition-colors ${!isAnnual ? 'text-neutral-900' : 'text-neutral-400'}`}>
              Facturación Mensual
            </span>
            <button
              type="button"
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-neutral-200 transition-colors duration-200 ease-in-out focus:outline-none"
              style={{ backgroundColor: isAnnual ? '#000000' : '#E5E5E5' }}
              aria-label="Cambiar periodo de facturación"
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isAnnual ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium transition-colors ${isAnnual ? 'text-neutral-900' : 'text-neutral-400'}`}>
                Facturación Anual
              </span>
              <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                Ahorra hasta 10%
              </span>
            </div>
          </div>
        </div>

        {/* Rejilla de Tarjetas de Precios */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 items-stretch max-w-6xl mx-auto">
          {plans.map((plan, index) => {
            const currentPrice = isAnnual ? plan.priceAnnual : plan.priceMonthly;

            return (
              <div
                key={index}
                className={`relative flex flex-col justify-between rounded-2xl p-8 transition-all duration-300 ${
                  plan.isPopular
                    ? 'bg-[#0B0F19] text-white shadow-2xl scale-105 z-10 border border-neutral-800'
                    : 'bg-white text-neutral-900 border border-neutral-200 shadow-sm hover:shadow-md'
                }`}
              >
                {/* Etiqueta Popular */}
                {plan.isPopular && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full bg-neutral-100 px-4 py-1 text-xs font-semibold text-neutral-900 uppercase tracking-wider shadow-sm">
                    Recomendado
                  </span>
                )}

                <div>
                  {/* Nombre y descripción del Plan */}
                  <h3 className="font-gotham text-xl font-bold tracking-tight mb-2">
                    {plan.name}
                  </h3>
                  <p className={`text-sm font-medium ${plan.isPopular ? "text-white" : "text-neutral-900"}`}>
                    {plan.description}
                  </p>
                  <p className={`text-sm min-h-[5px] ${plan.isPopular ? 'text-neutral-400' : 'text-neutral-500'}`}>
                    {plan.subdescription}
                  </p>

                  {/* Sección de Precio */}
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-2xl font-mediumitalic tracking-tight">$</span>
                    <span className="text-5xl font-medium tracking-tight transition-all duration-200">
                      {currentPrice}
                    </span>
                    <span className={`text-sm font-light ${plan.isPopular ? 'text-neutral-400' : 'text-neutral-500'}`}>
                      /MXN al mes + IVA
                    </span>
                  </div>

                  <hr className={`my-6 border-t ${plan.isPopular ? 'border-neutral-800' : 'border-neutral-100'}`} />

                  {/* Lista de características */}
                  <ul className="space-y-4">
                    {plan.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-start gap-3 text-sm">
                        <svg
                          className={`h-5 w-5 flex-shrink-0 ${plan.isPopular ? 'text-white' : 'text-black'}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="2.5"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        <span className={plan.isPopular ? 'text-neutral-300' : 'text-neutral-600'}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Botón de Acción Principal */}
                <div className="mt-8">
                  <button
                    type="button"
                    className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 ${
                      plan.isPopular
                        ? 'bg-white text-black hover:bg-neutral-100'
                        : 'bg-black text-white hover:bg-neutral-900'
                    }`}
                  >
                    {plan.buttonText}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sección de Garantía y Confianza */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start gap-6 rounded-4xl border border-neutral-100 bg-white p-8 md:p-10 shadow-card">
            {/* Icono */}
            <div className="flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-2xl bg-neutral-200">
              <ShieldCheck className="w-7 h-7 text-neutral-900" strokeWidth={1.75} />
            </div>

            {/* Contenido */}
            <div className="flex-1 w-full">
              <h3 className="font-gotham italic font-bold text-lg md:text-xl text-neutral-900 mb-2">
                Sin riesgo.
              </h3>
              <p className="font-gotham italic text-sm md:text-base text-neutral-500 leading-relaxed mb-6 max-w-2xl">
                Si en los primeros 30 días Kotta no funciona para tu condominio, te devolvemos el pago sin problema alguno
              </p>

              <hr className="border-t border-neutral-100 mb-6" />

              <ul className="space-y-3">
                {GARANTIA_ITEMS.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-200 flex-shrink-0" />
                    <span className="font-gotham italic text-sm text-neutral-500">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Cita de confianza */}
          <p className="mt-10 text-center font-gotham italic text-lg md:text-xl text-neutral-500 max-w-2xl mx-auto">
            "No existen funcionalidades <span className="font-bold text-neutral-900">bloqueadas</span> entre planes."
          </p>
        </div>

      </div>
    </section>
  );
}