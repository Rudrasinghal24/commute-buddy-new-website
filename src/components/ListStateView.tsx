import React from 'react';

export const RouteCardSkeleton: React.FC<{ count?: number }> = ({
  count = 3,
}) => {
  return (
    <div
      data-testid="routes_skeleton_list"
      className="w-full flex flex-col gap-[8px]"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="w-full rounded-[12px] bg-[#ffffff] border border-[#dadce0] p-[16px]"
        >
          <div className="flex items-center justify-between">
            <div className="w-[140px] h-[20px] rounded-[8px] bg-[#f1f3f4]" />
            <div className="w-[64px] h-[20px] rounded-[8px] bg-[#f1f3f4]" />
          </div>
          <div className="mt-[8px] w-[200px] h-[16px] rounded-[8px] bg-[#f1f3f4]" />
          <div className="mt-[8px] w-[96px] h-[24px] rounded-full bg-[#f1f3f4]" />
        </div>
      ))}
    </div>
  );
};

interface RoutesEmptyOrErrorBoxProps {
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const RoutesEmptyOrErrorBox: React.FC<RoutesEmptyOrErrorBoxProps> = ({
  title,
  subtitle,
  actionLabel,
  onAction,
}) => {
  return (
    <div
      data-testid="routes_state_box"
      className="w-full rounded-[12px] bg-[#ffffff] border border-[#dadce0] p-[24px] flex flex-col items-center text-center"
    >
      <div className="text-[16px] leading-[24px] font-medium text-[#202124]">
        {title}
      </div>
      <div className="mt-[4px] text-[14px] leading-[20px] text-[#5f6368]">
        {subtitle}
      </div>
      {actionLabel && onAction && (
        <button
          type="button"
          data-testid="routes_state_action_button"
          onClick={onAction}
          className="mt-[16px] h-[48px] px-[16px] rounded-full bg-[#1a73e8] text-[#ffffff] text-[14px] font-medium flex items-center justify-center cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
