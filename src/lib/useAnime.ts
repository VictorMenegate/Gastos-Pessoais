'use client'

import { useEffect, useRef } from 'react'
import anime from 'animejs'

/** Animate children with staggered entrance */
export function useStaggerIn(deps: any[] = []) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const children = ref.current.children
    if (!children.length) return

    anime({
      targets: Array.from(children),
      translateY: [16, 0],
      opacity: [0, 1],
      easing: 'easeOutCubic',
      duration: 350,
      delay: anime.stagger(40, { start: 50 }),
    })
  }, deps)

  return ref
}

/** Animate a single element entrance */
export function useEntrance(animation: 'fadeUp' | 'fadeScale' | 'slideRight' = 'fadeUp', deps: any[] = []) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return

    const configs = {
      fadeUp: {
        translateY: [16, 0],
        opacity: [0, 1],
        easing: 'easeOutCubic',
        duration: 350,
      },
      fadeScale: {
        scale: [0.95, 1],
        opacity: [0, 1],
        easing: 'easeOutCubic',
        duration: 350,
      },
      slideRight: {
        translateX: [-16, 0],
        opacity: [0, 1],
        easing: 'easeOutCubic',
        duration: 350,
      },
    }

    anime({
      targets: ref.current,
      ...configs[animation],
    })
  }, deps)

  return ref
}

/** Animate number counting up */
export function useCountUp(targetValue: number, duration = 600) {
  const ref = useRef<HTMLSpanElement>(null)
  const prevValue = useRef(0)

  useEffect(() => {
    if (!ref.current || isNaN(targetValue)) return

    const obj = { value: prevValue.current }
    anime({
      targets: obj,
      value: targetValue,
      duration,
      easing: 'easeOutExpo',
      round: 1,
      update: () => {
        if (ref.current) {
          ref.current.textContent = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(obj.value / 100)
        }
      },
    })

    prevValue.current = targetValue
  }, [targetValue])

  return ref
}

/** Hero timeline orchestration */
export function useHeroTimeline(loading: boolean) {
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (loading || !heroRef.current) return

    const hero = heroRef.current
    const greeting = hero.querySelector('[data-anim="greeting"]')
    const title = hero.querySelector('[data-anim="title"]')
    const balanceLabel = hero.querySelector('[data-anim="balance-label"]')
    const balanceValue = hero.querySelector('[data-anim="balance-value"]')
    const pills = hero.querySelectorAll('[data-anim="pill"]')
    const banner = hero.querySelector('[data-anim="banner"]')

    const tl = anime.timeline({
      easing: 'easeOutCubic',
    })

    tl.add({
      targets: greeting,
      translateX: [-12, 0],
      opacity: [0, 1],
      duration: 300,
    })
    .add({
      targets: title,
      translateX: [-12, 0],
      opacity: [0, 1],
      duration: 300,
    }, '-=200')
    .add({
      targets: balanceLabel,
      translateY: [8, 0],
      opacity: [0, 1],
      duration: 250,
    }, '-=150')
    .add({
      targets: balanceValue,
      translateY: [20, 0],
      opacity: [0, 1],
      scale: [0.95, 1],
      duration: 400,
    }, '-=200')
    .add({
      targets: Array.from(pills),
      translateY: [12, 0],
      opacity: [0, 1],
      delay: anime.stagger(50),
      duration: 300,
    }, '-=250')

    if (banner) {
      tl.add({
        targets: banner,
        translateY: [10, 0],
        opacity: [0, 1],
        duration: 300,
      }, '-=150')
    }
  }, [loading])

  return heroRef
}
