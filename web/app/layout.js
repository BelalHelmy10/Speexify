import "./globals.scss";

export const metadata = {
  title: "Speexify (Next)",
  description: "CRA → Next migration shell",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
