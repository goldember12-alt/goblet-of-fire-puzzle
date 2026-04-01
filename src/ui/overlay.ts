export type OverlayLayout = 'center' | 'sidebar';

export type OverlayViewHandle = {
  owner: string;
  root: HTMLDivElement;
  top: HTMLDivElement;
  main: HTMLDivElement;
  side: HTMLDivElement;
  footer: HTMLDivElement;
  modal: HTMLDivElement;
  destroy: () => void;
};

type OverlayOptions = {
  layout: OverlayLayout;
  sceneClass?: string;
};

class OverlayController {
  private currentOwner: string | null = null;

  show(owner: string, options: OverlayOptions): OverlayViewHandle {
    const root = this.getRoot();

    root.replaceChildren();
    this.currentOwner = owner;

    const view = document.createElement('div');
    view.className = `overlay-view overlay-view--${options.layout}${options.sceneClass ? ` ${options.sceneClass}` : ''}`;

    const top = document.createElement('div');
    top.className = 'overlay-slot overlay-slot--top';

    const main = document.createElement('div');
    main.className = 'overlay-slot overlay-slot--main';

    const side = document.createElement('div');
    side.className = 'overlay-slot overlay-slot--side';

    const footer = document.createElement('div');
    footer.className = 'overlay-slot overlay-slot--footer';

    const modal = document.createElement('div');
    modal.className = 'overlay-slot overlay-slot--modal';

    view.append(top, main, side, footer, modal);
    root.append(view);

    return {
      owner,
      root: view,
      top,
      main,
      side,
      footer,
      modal,
      destroy: () => this.clear(owner)
    };
  }

  clear(owner?: string): void {
    if (owner && owner !== this.currentOwner) {
      return;
    }

    const root = this.getRoot();
    root.replaceChildren();
    this.currentOwner = null;
  }

  private getRoot(): HTMLDivElement {
    const root = document.getElementById('ui-overlay-root');

    if (!(root instanceof HTMLDivElement)) {
      throw new Error('Expected #ui-overlay-root to exist before creating scene overlays.');
    }

    return root;
  }
}

export const overlayController = new OverlayController();
