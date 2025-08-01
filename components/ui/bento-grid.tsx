import { cn } from "@/lib/utils";

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "mx-auto grid max-w-7xl grid-cols-1 gap-4 md:auto-rows-[18rem] md:grid-cols-3",
        className,
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "group/bento shadow-input row-span-1 flex flex-col justify-between rounded-3xl border border-neutral-200 bg-white transition duration-200 hover:shadow-xl dark:border-white/[0.2] dark:bg-black dark:shadow-none relative overflow-hidden",
        className,
      )}
    >
      {header}
      <div className="transition duration-200 -translate-x-2 group-hover/bento:translate-x-0 pb-4 absolute bottom-0 opacity-0 group-hover/bento:opacity-100 bg-gradient-to-t from-black/50 to-transparent w-full">
        <div className="px-4 text-neutral-50">
          {icon}
          <div className="mt-2 mb-2 font-sans font-bold">
            {title}
          </div>
          <div className="font-sans text-xs font-normal text-neutral-300">
            {description}
          </div>
        </div>
      </div>
    </div>
  );
};
