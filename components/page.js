import React from 'react'
import Head from 'next/head'

const Header = () => (
  <Head>
    <style>{`
      body, html {
        margin: 0;
        padding: 0;
      }
      body {
        font-family: sans-serif;
        background: #000;
      }
      * { box-sizing: border-box; }
    `}</style>
  </Head>
)

export default ({ children }) => (
  <div>
    <Header />
    {children}
  </div>
)
