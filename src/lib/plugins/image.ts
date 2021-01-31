import { Injector, Renderer2 } from '@angular/core';
import { NgElement, WithProperties } from '@angular/elements';
import { Node as ProseMirrorNode } from 'prosemirror-model';
import { NodeSelection, Plugin, PluginKey } from 'prosemirror-state';
import { EditorView, NodeView } from 'prosemirror-view';

import { ImageViewComponent } from '../components/image-view/image-view.component';

const WRAPPER_CLASSNAME = 'NgxEditor__ImageWrapper';
const WRAPPER_RESIZE_ACTIVE_CLASSNAME = 'NgxEditor__Resizer--Active';
const RESIZE_HANDLE_CLASSNAME = 'NgxEditor__ResizeHandle';

const createHandle = (direction: string): HTMLElement => {
  const handle = document.createElement('span');
  handle.className = `${RESIZE_HANDLE_CLASSNAME}--${direction}`;
  return handle;
};

class ImageRezieView implements NodeView {
  img: HTMLElement;
  dom: NgElement & WithProperties<ImageViewComponent>;
  handle: HTMLElement;
  view: EditorView;
  getPos: () => number;

  constructor(node: ProseMirrorNode, view: EditorView, getPos: () => number, injector: Injector) {
    const renderer = injector.get(Renderer2);

    const dom = renderer.createElement('ngx-image-view') as NgElement & WithProperties<ImageViewComponent>;
    dom.src = node.attrs.src;
    dom.alt = node.attrs.alt;
    dom.title = node.attrs.title;
    dom.outerWidth = node.attrs.width;
    dom.view = view;

    this.dom = dom;
    this.view = view;
    this.getPos = getPos;

    this.dom.addEventListener('imageResize', this.handleResize);
  }

  handleResize = (): void => {
    const { state, dispatch } = this.view;
    const { tr } = state;

    const transaction = tr.setNodeMarkup(this.getPos(), undefined, {
      src: this.dom.src,
      width: this.dom.outerWidth
    });

    const resolvedPos = transaction.doc.resolve(this.getPos());
    const newSelection = new NodeSelection(resolvedPos);

    transaction.setSelection(newSelection);
    dispatch(transaction);
  }

  selectNode(): void {
    this.dom.selected = true;
  }

  deselectNode(): void {
    this.dom.selected = false;
  }

  destroy(): void {
    this.dom.removeEventListener('imageResize', this.handleResize);
  }
}

const imagePlugin = (injector: Injector): Plugin => {

  return new Plugin({
    key: new PluginKey('link'),
    props: {
      nodeViews: {
        image: (node: ProseMirrorNode, view: EditorView, getPos: () => number) => {
          return new ImageRezieView(node, view, getPos, injector);
        },
      }
    }
  });
};

export default imagePlugin;