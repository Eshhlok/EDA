export default function Footer() {
  return (
    <footer className="border-t border-border mt-12">
      <div className="mx-auto max-w-7xl px-4 py-6 text-center text-sm text-muted-foreground">
        <p>Built for data exploration and analytics.</p>

        <p className="mt-2">
          A project by <span className="font-medium">Eshlok Agarwal</span> •{" "}
          <a
            href="https://www.linkedin.com/in/eshlok-agarwal-134877380/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            LinkedIn
          </a>{" "}
          • 2026
        </p>
      </div>
    </footer>
  );
}