declare module "qrcode" {
  type ToDataUrlOptions = {
    margin?: number;
    width?: number;
  };

  const QRCode: {
    toDataURL(text: string, options?: ToDataUrlOptions): Promise<string>;
  };

  export default QRCode;
}
