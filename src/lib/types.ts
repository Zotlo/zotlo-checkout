export interface IZotloCheckoutParams {
  token: string;
  packageId: string;
  events?: {
    onLoad?: () => void;
    onUpdate?: () => void;
    onSubmit?: () => void;
  }
}
