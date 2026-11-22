import { useEffect, useState } from 'react'

export const useNow = (step = 30000) => {
  const [n, setN] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setN(Date.now()), step)
    return () => clearInterval(t)
  }, [step])
  return n
}

export function useCountUp(target, ms = 900) {
  const [v, setV] = useState(0)
  useEffect(() => {
    let raf, t0
    const step = t => {
      t0 ??= t
      const p = Math.min((t - t0) / ms, 1)
      setV(target * (1 - Math.pow(1 - p, 3)))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])
  return v
}

/* Mini gestionnaire de formulaire : valeurs, erreurs, champs touchés, soumission validée */
export function useForm(initial, validate) {
  const [values, setValues] = useState(initial)
  const [touched, setTouched] = useState({})
  const errors = validate(values)
  const set = (name, value) => setValues(v => ({ ...v, [name]: value }))
  const bind = name => ({
    name,
    value: values[name],
    error: touched[name] ? errors[name] : '',
    onChange: e => set(name, e.target.value),
    onBlur: () => setTouched(t => ({ ...t, [name]: true })),
  })
  const submit = fn => e => {
    e.preventDefault()
    setTouched(Object.keys(initial).reduce((a, k) => ({ ...a, [k]: true }), {}))
    if (Object.values(errors).some(Boolean)) return
    return fn(values)
  }
  const reset = () => { setValues(initial); setTouched({}) }
  return { values, errors, touched, set, bind, submit, reset }
}
