// Code related to the TOTP key edit dialog component
import {
  Button,
  ButtonGroup,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
} from '@mui/material'
import { useState } from 'react'
import { createTotpKey, updateTotpKey, type TotpKey } from './api-client'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { useQueryClient } from '@tanstack/react-query'

type KeyEditDialogProps = {
  totpKey: TotpKey
  onClose: (deleteTotpKey?: TotpKey) => void
}

export const KeyEditDialog = (props: KeyEditDialogProps) => {
  const isCreate = props.totpKey.id == ''
  const [name, setName] = useState(props.totpKey.name)
  const [key, setKey] = useState(props.totpKey.key)
  const [showKey, setShowKey] = useState(false)
  const queryClient = useQueryClient()
  const handleClickShowKey = () => setShowKey(show => !show)
  const handleMouseDownKey = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
  }
  return <Dialog
      open
      onClose={() => props.onClose()}
      fullWidth
    >
    <DialogTitle>{isCreate ? 'Create Key' : 'Edit Key' }</DialogTitle>
    <DialogContent>
      <p style={{ marginBottom: 0}}></p>
      <Stack gap={1}>
        <TextField
          size="small"
          label="Name"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <TextField
          type={showKey ? 'text' : 'password'}
          size="small"
          label="Key"
          value={key}
          onChange={e => setKey(e.target.value)}
          slotProps={{ input: {
          endAdornment: <InputAdornment position="end">
            <IconButton
            aria-label="toggle password visibility"
            onClick={handleClickShowKey}
            onMouseDown={handleMouseDownKey}
            edge="end"
            >
            {showKey ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </InputAdornment>
          }}}
        />
      </Stack>
    </DialogContent>
    <DialogActions>
      {!isCreate && <>
        <ButtonGroup>
          <Button variant="contained" color="error" onClick={() => props.onClose(props.totpKey)}>Delete</Button>
        </ButtonGroup>
        <div style={{ flexGrow: 1 }}></div>
      </>}
      <ButtonGroup>
        <Button onClick={() => props.onClose()}>Cancel</Button>
        <Button variant="contained" onClick={async () => {
          if (isCreate) {
            await createTotpKey({
              ...props.totpKey,
              name,
              key,
            })
          } else {
            await updateTotpKey({
              ...props.totpKey,
              name,
              key,
            })
          }
          queryClient.invalidateQueries({ queryKey: ['totp-keys'] })
          props.onClose()
        }} autoFocus>
          Save
        </Button>
      </ButtonGroup>
    </DialogActions>
  </Dialog>
}
