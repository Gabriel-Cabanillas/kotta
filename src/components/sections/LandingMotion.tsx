'use client'

import { useEffect } from 'react'

export default function LandingMotion() {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('.landing-reveal, .landing-line'))
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reducedMotion || !('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('is-revealed'))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed')
          observer.unobserve(entry.target)
        }
      }),
      { rootMargin: '0px 0px -10% 0px', threshold: 0.12 },
    )

    elements.forEach((element) => observer.observe(element))

    const hero = document.querySelector<HTMLElement>('#inicio')
    const parallaxLayers = hero ? Array.from(hero.querySelectorAll<HTMLElement>('[data-parallax-speed]')) : []
    let frame = 0
    const updateParallax = () => {
      frame = 0
      if (!hero || window.scrollY > hero.offsetHeight * 1.15) return
      const scroll = Math.max(0, window.scrollY)
      parallaxLayers.forEach((layer) => {
        const speed = Number(layer.dataset.parallaxSpeed ?? 0)
        layer.style.translate = `0 ${Math.round(scroll * speed)}px`
      })
    }
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(updateParallax)
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  return null
}
