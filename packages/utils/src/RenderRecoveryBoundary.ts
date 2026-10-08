import { Component, type ReactNode } from "react"

type RenderRecoveryBoundaryProps = {
  readonly children: ReactNode
  readonly fallback: (retry: () => void, error: unknown) => ReactNode
}

export default class RenderRecoveryBoundary extends Component<
  RenderRecoveryBoundaryProps,
  { readonly failure: { readonly error: unknown } | null }
> {
  state: { readonly failure: { readonly error: unknown } | null } = {
    failure: null,
  }

  static getDerivedStateFromError(error: unknown) {
    return { failure: { error } }
  }

  retry = () => this.setState({ failure: null })

  render() {
    return this.state.failure
      ? this.props.fallback(this.retry, this.state.failure.error)
      : this.props.children
  }
}
