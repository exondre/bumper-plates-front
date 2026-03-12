import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-pwa-update-sheet',
  imports: [],
  templateUrl: './pwa-update-sheet.component.html',
  styleUrl: './pwa-update-sheet.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PwaUpdateSheetComponent {
  readonly visible = input<boolean>(false);
  readonly isUpdating = input<boolean>(false);
  readonly isError = input<boolean>(false);
  readonly updateVersionLabel = input<string | null>(null);
  readonly dismiss = output<void>();
  readonly accept = output<void>();
  readonly retry = output<void>();

  /**
   * Emits the dismiss action for the current update prompt.
   */
  onDismissClick(): void {
    if (this.isUpdating()) {
      return;
    }

    this.dismiss.emit();
  }

  /**
   * Emits the accept action to activate the latest downloaded version.
   */
  onAcceptClick(): void {
    if (this.isUpdating()) {
      return;
    }

    this.accept.emit();
  }

  /**
   * Emits the retry action after a failed update attempt.
   */
  onRetryClick(): void {
    this.retry.emit();
  }
}
