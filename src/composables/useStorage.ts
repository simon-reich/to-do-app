import { useTodosStore } from '../stores/todos'

function readFileViaInput(): Promise<string> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) { reject(new Error('No file selected')); return }
      resolve(await file.text())
    }
    input.click()
  })
}

export function useStorage() {
  async function exportData() {
    const store = useTodosStore()
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      todos: store.todos,
      tags: store.tags,
      projects: store.projects,
      lastResetDate: store.lastResetDate,
    }
    const json = JSON.stringify(payload, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const filename = `todos-${new Date().toISOString().slice(0, 10)}.json`

    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
        })
        const writable = await handle.createWritable()
        await writable.write(blob)
        await writable.close()
        return
      } catch (e) {
        if ((e as Error).name === 'AbortError') return
        // non-abort error → fall through to download fallback
      }
    }

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  async function importData() {
    const store = useTodosStore()

    let text: string
    try {
      if ('showOpenFilePicker' in window) {
        try {
          const [handle] = await (window as any).showOpenFilePicker({
            types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
          })
          const file = await handle.getFile()
          text = await file.text()
        } catch (e) {
          if ((e as Error).name === 'AbortError') return
          text = await readFileViaInput()
        }
      } else {
        text = await readFileViaInput()
      }

      const data = JSON.parse(text)
      store.importData({
        todos: Array.isArray(data.todos) ? data.todos : [],
        tags: Array.isArray(data.tags) ? data.tags : [],
        projects: Array.isArray(data.projects) ? data.projects : [],
        lastResetDate: typeof data.lastResetDate === 'string' ? data.lastResetDate : '',
      })
    } catch (e) {
      if ((e as Error).message !== 'No file selected') {
        alert('Import failed: invalid or corrupted JSON file.')
      }
    }
  }

  return { exportData, importData }
}
