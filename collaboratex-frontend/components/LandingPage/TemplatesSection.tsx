import React from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGetPublicTemplates } from "@/src/graphql/generated";

export default function TemplatesSection() {
  const navigate = useNavigate();
  const { data, loading } = useGetPublicTemplates();

  // Get only the 4 most recent public templates
  const templates = data?.publicTemplates?.slice(0, 4) || [];

  const TemplateCard: React.FC<{ title: string; img: string; tag: string }> = ({
    title,
    img,
    tag,
  }) => (
    <div
      className="group cursor-pointer"
      onClick={() => navigate("/templates")}
    >
      <div className="aspect-[3/4] rounded-xl border border-slate-100 overflow-hidden mb-3 shadow-sm group-hover:shadow-md transition-all bg-slate-50">
        {img ? (
          <img
            src={img}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold text-4xl">
            {title.charAt(0)}
          </div>
        )}
      </div>
      <span className="text-[10px] uppercase tracking-wider font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
        {tag}
      </span>
      <h4 className="font-bold text-slate-900 mt-2">{title}</h4>
    </div>
  );

  return (
    <section id="templates" className="py-24 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              Start from a Template
            </h2>
            <p className="text-slate-500">
              Get up and running in seconds with professional layouts.
            </p>
          </div>
          <button
            onClick={() => navigate("/templates")}
            className="text-blue-600 font-semibold flex items-center gap-1 hover:underline"
          >
            View all <ChevronRight size={16} />
          </button>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="animate-spin text-blue-500" size={40} />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {templates.map((t) => (
              <TemplateCard
                key={t.id}
                title={t.name}
                img={t.previewImage}
                // Fallback to the first tag or "General"
                tag={t.tags?.[0] || "Template"}
              />
            ))}

            {/* If there are no templates in DB, show a friendly message */}
            {!loading && templates.length === 0 && (
              <p className="col-span-full text-center text-slate-400 py-10 border-2 border-dashed rounded-xl">
                No public templates available yet.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
