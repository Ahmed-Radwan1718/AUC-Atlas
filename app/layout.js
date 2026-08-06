import "./globals.css";
import "./site-header.css";

export const metadata = {
  title: "AUC Atlas | Professors, Courses & Student Materials",
  icons: {
    icon: "/favicon.svg"
  }
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
