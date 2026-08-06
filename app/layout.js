import "./globals.css";

export const metadata = {
  title: "AUC Atlas | Professors, Courses & Student Materials"
};

export const viewport = {
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
