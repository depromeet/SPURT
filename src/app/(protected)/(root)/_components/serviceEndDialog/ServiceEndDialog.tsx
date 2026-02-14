import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";

const SERVICE_END_DIALOG_STORAGE_KEY = "serviceEndDialogDontShow";

interface ServiceEndDialogProps {
	value: boolean;
	onButtonClick: () => void;
}

export function ServiceEndDialog({
	value,
	onButtonClick,
}: ServiceEndDialogProps) {
	const [open, setOpen] = useState(false);
	const [dontShowAgain, setDontShowAgain] = useState(false);

	useEffect(() => {
		setOpen(value);
	}, [value]);

	const handleButtonClick = () => {
		if (dontShowAgain) {
			localStorage.setItem(SERVICE_END_DIALOG_STORAGE_KEY, "true");
		}
		onButtonClick();
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent className="w-[328px] rounded-[24px] border-none bg-component-gray-secondary px-4 pt-6 pb-4">
				<div>
					<div className="text-[24px] font-bold text-gray-normal mb-4 text-center">
						서비스 종료 안내
					</div>
					<div className="mb-2 text-center text-b3 text-gray-neutral whitespace-pre-line">
						{`그동안 SPURT를 이용해 주셔서 진심으로 감사합니다.
SPURT는 2026년 2월 20일부로 서비스를 종료하게 되었습니다.
서비스 종료 이후에는 앱 이용이 불가하며,
관련 데이터 또한 모두 안전하게 삭제될 예정입니다.

그동안 이용해 주셔서 정말 감사합니다.

SPURT 팀 드림`}
					</div>
				</div>
				<div className="flex items-center justify-end gap-2 mb-3">
					<label
						htmlFor="dontShowAgain"
						className="text-c2 text-gray-neutral cursor-pointer flex items-center gap-2"
					>
						<input
							id="dontShowAgain"
							type="checkbox"
							checked={dontShowAgain}
							onChange={(e) => setDontShowAgain(e.target.checked)}
							className="w-4 h-4 rounded border-gray-normal cursor-pointer"
						/>
						다시 보지 않기
					</label>
				</div>
				<Button
					size="md"
					variant="primary"
					className="w-full"
					onClick={handleButtonClick}
				>
					확인
				</Button>
			</DialogContent>
		</Dialog>
	);
}

export function shouldShowServiceEndDialog(): boolean {
	if (typeof window === "undefined") return true;
	const dontShow = localStorage.getItem(SERVICE_END_DIALOG_STORAGE_KEY);
	return dontShow !== "true";
}
