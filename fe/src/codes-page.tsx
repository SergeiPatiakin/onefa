// Code related to the TOTP codes page component
import { useEffect, useRef, useState } from 'react'
import { type TotpKey } from './api-client'
import { Container, List, ListItemButton, ListItemText } from '@mui/material'
import { generateTotp } from './totp'
import { useHalfMinuteTick } from './react-utils'
import { NavBar } from './navbar'

type TotpCode = {
  id: string,
  name: string,
  code: string,
}

interface CodesPageProps {
  totpKeys: Array<TotpKey>
}

export const CodesPage = (props: CodesPageProps) => {
  const [totpCodes, setTotpCodes] = useState<Array<TotpCode>>([])
  const [progress, setProgress] = useState(0)

  useHalfMinuteTick(() => (async () => {
    setTotpCodes(await Promise.all(
      props.totpKeys
      .map(async totpKey => ({
        id: totpKey.id,
        name: totpKey.name,
        code: await generateTotp(totpKey.key),
      }))
    ))
  })(), [props.totpKeys])

  const animationRef = useRef<number>(0)

  useEffect(() => {
    const update = () => {
      // TOTP rotates every 30 seconds
      setProgress((Date.now() % 30000) / 30000 * 100)
      animationRef.current = requestAnimationFrame(update)
    }

    animationRef.current = requestAnimationFrame(update)

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [])

  return (
    <>
      <NavBar currentPage={'codes'} />
      {totpCodes.length > 0 ? <>
        <div>
          <div style={{ position: 'absolute', left: '0px', height: '100%', width: `${progress}%`, backgroundColor: 'lightcyan'}}></div>
        </div>
        <List component="nav">
          {totpCodes.map(totpCode => (
            <ListItemButton key={totpCode.id} onClick={() => {
              navigator.clipboard.writeText(totpCode.code)
            }}>
              <ListItemText primary={totpCode.name} />
              <p style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '20px', margin: '0px' }}>
                {totpCode.code.slice(0, 3) + ' ' + totpCode.code.slice(3, 6)}
              </p>
            </ListItemButton>
          ))}
        </List>
        </>
      : <>
          <Container>
            <h2>No codes available</h2>
            <p>Add keys to get codes</p>
          </Container>
        </>
      }
    </>
  )
}
