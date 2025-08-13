// Code related to React helpers and utilities
import { useEffect } from "react"

export const useHalfMinuteTick = (
  callback: () => void,
  deps: React.DependencyList = []
) => {
  useEffect(() => {
    // Run immediately
    callback()

    // Time until the next round minute
    const now = new Date()
    const msUntilNextMinute =
      (60 - now.getSeconds()) * 1000 - now.getMilliseconds()
    const msUntilNextHalfMinute = msUntilNextMinute % 30000

    let intervalId: number

    const timeoutId = window.setTimeout(() => {
      callback()
      intervalId = window.setInterval(callback, 30_000)
    }, msUntilNextHalfMinute)

    return () => {
      clearTimeout(timeoutId)
      if (intervalId) clearInterval(intervalId)
    }
  }, deps)
}
