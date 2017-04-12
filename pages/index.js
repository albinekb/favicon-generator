import React, { Component } from 'react'
import Page from '../components/page'
import JSZip from 'jszip'
import fetch from 'isomorphic-fetch'
import prettyBytes from 'pretty-bytes'

function downloadBlobAsFile ({data, contentType, filename}) {
  const element = document.createElement('a')
  document.body.appendChild(element)
  element.style.display = 'none'

  const blob = new window.Blob([data], { type: contentType })
  const url = window.URL.createObjectURL(blob)
  element.href = url
  element.download = filename
  element.click()
  window.URL.revokeObjectURL(url)

  document.body.removeChild(element)
}

const Magic = ({ keys, count, all }) => {
  return (
    <div style={{ position: 'absolute', color: 'rgba(255,255,255,.4)', top: 0, left: 0, fontSize: '10px', fontFamily: 'monospace', fontWeight: 100 }}>
      <div>
        Index of emojis.zip:
      </div>
      <div style={{ marginLeft: '20px' }}>
        {Array.from({ length: count }).map((_, index, all) => keys[index]).map(key => (<div key={key}>{key}.png</div>)).reverse()}
      </div>
    </div>
  )
}

class Canvas extends Component {
  constructor (props) {
    super(props)
    this.state = { count: 0, done: false, avgTime: 0, size: null, addedSize: 0 }
    this.zip = new JSZip()
    this.onDownload = this.onDownload.bind(this)
    this.generateAll = this.generateAll.bind(this)
  }

  renderText (text) {
    const canvas = this.refs.canvas
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.font = '54px Apple Color Emoji'
    ctx.fillText(text, 6, 54)
  }

  componentDidMount () {
    this.renderText('⚡')
  }

  onDownload () {
    const blob = this.zipBlob ? Promise.resolve(this.zipBlob) : this.zip.generateAsync({ type: 'blob' })

    blob.then(zip => {
      downloadBlobAsFile({data: zip, contentType: 'application/zip', filename: `emojis.zip`})
    })
  }

  async generateAll () {
    const { emojis } = this.props
    let count = 0
    let allTime = 0
    let avgTime = 0
    let addedSize = 0
    for (const [name, emoji] of emojis.entries) {
      const start = window.performance.now()
      this.renderText(emoji)
      const blob = await this.getBlob()
      addedSize = addedSize + blob.size
      await this.zip.file(`${name}.png`, blob)
      count = count + 1
      const end = window.performance.now()
      const total = end - start
      allTime = allTime + total
      avgTime = allTime / count
      this.setState({ count, avgTime, addedSize })
    }

    const zipBlob = await this.zip.generateAsync({ type: 'blob' })
    this.zipBlob = zipBlob

    this.setState({ done: true, size: zipBlob.size })
  }

  async getBlob () {
    return new Promise((resolve, reject) => this.refs.canvas.toBlob(blob => resolve(blob)))
  }

  render () {
    const { count, done, avgTime, size } = this.state
    const isStarted = count !== 0
    const { emojis } = this.props
    const timeLeft = (avgTime * (emojis.keys.length - count))
    const prettySize = size ? `(${prettyBytes(size)})` : ''

    return (
      <div>
        {done && <Magic keys={emojis.keys} count={count} />}
        <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column', textAlign: 'center' }}>
          <canvas title='canvas' ref='canvas' width={this.props.width || 64} height={this.props.height || 64} />
          {!done && (
            <button disabled={isStarted} onClick={this.generateAll}>
              {!isStarted && `Render (${emojis.values.length} icons)`}
              {isStarted && `Rendering emojis (${Number((count / emojis.keys.length) * 100).toFixed(2)}%)`}
            </button>
          )}
          {done && (<button disabled>DONE!</button>)}
          <button disabled={!done} onClick={this.onDownload}>
            {isStarted && !done ? `emojis.zip ready in ${Number(timeLeft / 1000).toFixed(2)}s` : `Download emojis.zip ${prettySize}`}
          </button>
          <style jsx>{`
            canvas {
              box-shadow: 0px 0px 30px rgba(0,0,0,.2);
              margin: 40px;
              cursor: pointer;
            }
            button {
              font-family: monospace;
              margin: 5px 0px;
              appearance: none;
              background: #000;
              color: #FFF;
              border: none;
              padding: 10px 20px;
              border-radius: 2px;
              cursor: pointer;
              width: 100%;
            }
            button[disabled] {
              cursor: default;
              opacity: 0.5;
            }
            div {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              background: #FFF;
              padding: 20px;
              border-radius: 3px;
              min-width: 500px;
            }
          `}</style>
        </div>
      </div>
    )
  }
}

export default class Index extends Component {
  static async getInitialProps ({ req }) {
    const { host } = req.headers
    const response = await fetch(`http://${host}/static/emoji.json`)
    const emojis = await response.json()
    const values = Object.values(emojis)
    const keys = Object.keys(emojis)
    const entries = Object.entries(emojis)
    return { emojis: { values, keys, entries, all: emojis } }
  }

  render () {
    const { emojis } = this.props
    return (
      <Page>
        <div>
          <Canvas emojis={emojis} />
        </div>
      </Page>
    )
  }
}
