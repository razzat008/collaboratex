import BrandLogo from "../BrandLogo";
export default function FooterSection() {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 py-12">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <BrandLogo className="justify-center mb-6" size="sm" />
        <p className="text-slate-500 text-sm mb-8">© 2024 Collaboratex. Built for the modern researcher.</p>
        <div className="flex justify-center gap-8 text-slate-400 text-sm">
          <a href="#" className="hover:text-slate-900">Privacy</a>
          <a href="#" className="hover:text-slate-900">Terms</a>
          <a href="#" className="hover:text-slate-900">Security</a>
          <a href="#" className="hover:text-slate-900">Contact</a>
        </div>
      </div>
    </footer>
  )
}
