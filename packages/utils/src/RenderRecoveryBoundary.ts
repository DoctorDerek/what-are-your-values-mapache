import { Component, type ReactNode } from "react"

type RenderRecoveryBoundaryProps = {
  readonly children: ReactNode
  readonly fallback: (retry: () => void) => ReactNode
}

export default class RenderRecoveryBoundary extends Component<
  RenderRecoveryBoundaryProps,
  { readonly hasError: boolean }
> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  retry = () => this.setState({ hasError: false })

  render() {
    return this.state.hasError
      ? this.props.fallback(this.retry)
      : this.props.children
  }
}
