export class MessageBuffer {
  private TIME_TO_TRIGGER = 500;

  private _messages: Map<string, string[]>;
  private _action: (message: string, metdata: string[]) => any;

  constructor() {
    this._messages = new Map<string, string[]>();
    this._action = () => {};
  }

  registerAction(action: (message: string, metadata: string[]) => any) {
    this._action = action;
  }

  addMessage(message: string, metadata: string | undefined = undefined) {
    const existingMetadataList = this._messages.get(message) ?? [];
    if (existingMetadataList.length === 0) {
      const newMetadataList = metadata ? [metadata] : [];
      this._messages.set(message, newMetadataList);
    } else if (metadata) {
      this._messages.set(message, [...existingMetadataList, metadata]);
    }

    setTimeout(this.triggerAction.bind(this), this.TIME_TO_TRIGGER);
  }

  private triggerAction() {
    if (!this._messages || this._messages.size === 0) {
      return;
    }

    for (const message of this._messages.keys()) {
      this._action(message, this._messages.get(message) ?? []);
    }

    this._messages.clear();
  }
}
