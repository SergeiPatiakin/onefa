// Code related to the TOTP keys page component
import { Container, Fab, List, ListItemButton, ListItemText } from "@mui/material"
import AddIcon from '@mui/icons-material/Add'
import type { TotpKey } from "./api-client"
import { NavBar } from "./navbar"
import { useState } from "react"
import { KeyEditDialog } from "./key-edit-dialog"
import { KeyDeleteDialog } from "./key-delete-dialog"

interface KeysPageProps {
  totpKeys: Array<TotpKey>
}

type KeyEditDialogState = {
  visible: false
} | {
  visible: true
  totpKey: TotpKey
}

type KeyDeleteDialogState = {
  visible: false
} | {
  visible: true
  totpKey: TotpKey
}

export const KeysPage = (props: KeysPageProps) => {
  const [keyEditDialogState, setKeyEditDialogState] =
    useState<KeyEditDialogState>({ visible: false })
  const [keyDeleteDialogState, setKeyDeleteDialogState] =
    useState<KeyDeleteDialogState>({ visible: false })
  return (
    <>
      <NavBar currentPage={'keys'} />
      {keyEditDialogState.visible &&
        <KeyEditDialog
          totpKey={keyEditDialogState.totpKey}
          onClose={(deleteTotpKey?: TotpKey) => {
            setKeyEditDialogState({ visible: false })
            if (deleteTotpKey) {
              setKeyDeleteDialogState({ visible: true, totpKey: deleteTotpKey })
            }
          }}
        />
      }
      {keyDeleteDialogState.visible &&
        <KeyDeleteDialog
          totpKey={keyDeleteDialogState.totpKey}
          onClose={() => setKeyDeleteDialogState({ visible: false })}
        />
      }
      {props.totpKeys.length > 0 ? <>
        <List component="nav" aria-label="secondary mailbox folder">
          {props.totpKeys.map(totpKey => (
            <ListItemButton key={totpKey.id} onClick={() => {
              setKeyEditDialogState({ visible: true, totpKey })
            }}>
              <ListItemText primary={totpKey.name} />
            </ListItemButton>
          ))}
        </List>
        </>
      : <>
        <Container>
          <p>Add keys to get started</p>
        </Container>
        </>
      }
      <Fab
        color="primary"
        aria-label="add"
        style={{ position: 'fixed', right: '16px', bottom: '16px'}}
        onClick={() => {
          setKeyEditDialogState({ visible: true, totpKey: {
            id: '',
            name: '',
            key: '',
          }})
        }}
      >
        <AddIcon />
      </Fab>
    </>
  )
}
