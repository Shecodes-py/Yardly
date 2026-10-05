import { Component } from 'react'
import { logClientError } from '../logging'

export default class ErrorBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error, info) { logClientError('render', { name: error.name, stack: info.componentStack }) }
  render() {
    if (this.state.failed) return <div className="center-page" role="alert"><h1>Something went wrong</h1><p>Please reload the page to try again.</p><button className="btn btn-primary" onClick={() => window.location.reload()}>Reload Yardly</button></div>
    return this.props.children
  }
}
