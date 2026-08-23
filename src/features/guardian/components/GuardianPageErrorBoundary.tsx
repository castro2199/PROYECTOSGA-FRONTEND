import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  resetKey: string;
};

type State = {
  hasError: boolean;
};

export class GuardianPageErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("No se pudo renderizar el portal del apoderado", error, info);
  }

  componentDidUpdate(previousProps: Props) {
    if (this.state.hasError && previousProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  private retry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <section className="rounded-lg border border-red-100 bg-red-50 px-6 py-10 text-center">
        <h2 className="text-lg font-bold text-red-700">
          No se pudo mostrar Mis estudiantes
        </h2>
        <p className="mt-2 text-sm text-red-700">
          Ocurrio un error al procesar la informacion del estudiante.
        </p>
        <button
          className="mt-5 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
          onClick={this.retry}
          type="button"
        >
          Reintentar
        </button>
      </section>
    );
  }
}
