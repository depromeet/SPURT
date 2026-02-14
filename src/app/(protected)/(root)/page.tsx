"use client";

import { useDeleteTask, useHomeData, useStartTask } from "@/hooks/useTasks";
import type { Task, TaskWithPersona } from "@/types/task";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useEffect, Suspense, useCallback } from "react";

import SpurtyLoader from "@/components/spurtyLoader/SpurtyLoader";
import useTaskFiltering from "@/hooks/useTaskFilter";
import useTaskStatus from "@/hooks/useTaskStatus";
import CharacterDialog from "../(create)/_components/characterDialog/CharacterDialog";
import FailedDialog from "../(create)/_components/failedDialog/FailedDialog";
import CreateTaskSheet from "./_components/CreateTaskSheet";
import TaskDetailSheet from "./_components/TaskDetailSheet";
import AllTaskTabWrapper from "./_components/allTaskTabWrapper/AllTaskTabWrapper";
import Footer from "./_components/footer/Footer";
import Header from "./_components/header/Header";
import TodayTaskTabWrapper from "./_components/todayTaskTabWrapper/TodayTaskTabWrapper";
import {
	ServiceEndDialog,
	shouldShowServiceEndDialog,
} from "./_components/serviceEndDialog/ServiceEndDialog";

const HomePageContent = () => {
	const router = useRouter();
	const { data: homeData, isPending } = useHomeData();

	const { mutate: startTaskMutation } = useStartTask();
	const { mutate: deleteTaskMutation } = useDeleteTask();

	const { allTasks, todayTasks, weeklyTasks, inProgressTasks, futureTasks } =
		useTaskFiltering(homeData);

	const {
		isTotallyEmpty,
		hasWeeklyTasksOnly,
		hasAllTasksOnly,
		isAllEmpty,
		hasTodayAndInProgressTasks,
		hasInProgressTasksOnly,
		hasTodayTasksOnly,
		numberOfTodayTask,
		numberOfAllTask,
	} = useTaskStatus({
		todayTasks,
		weeklyTasks,
		allTasks,
		inProgressTasks,
	});

	const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
	const [activeTab, setActiveTab] = useState<"today" | "all">("today");
	const [detailTask, setDetailTask] = useState<Task | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isFailedDialogOpen, setIsFailedDialogOpen] = useState(false);
	const [personaId, setPersonaId] = useState<number | undefined>(undefined);
	const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
	const [isServiceEndDialogOpen, setIsServiceEndDialogOpen] = useState(false);

	const searchParams = useSearchParams();
	const [taskName, setTaskName] = useState("");
	const [personaName, setPersonaName] = useState("");
	const [taskType, setTaskType] = useState("");
	const [urgentTaskId, setUrgentTaskId] = useState<number | undefined>(
		undefined,
	);
	const [isLoading, setIsLoading] = useState(false);

	const handleDetailTask = (task: Task) => {
		setDetailTask(task);
		setIsDetailSheetOpen(true);
	};

	const handleDeleteTask = useCallback(
		(taskId: number) => {
			deleteTaskMutation(taskId);
			if (isDetailSheetOpen && detailTask && detailTask.id === taskId) {
				setIsDetailSheetOpen(false);
			}
		},
		[deleteTaskMutation, isDetailSheetOpen, detailTask],
	);

	const handleTaskClick = useCallback((task: Task) => {
		setDetailTask(task);
		setIsDetailSheetOpen(true);
	}, []);

	const handleCloseDetailSheet = () => {
		setIsDetailSheetOpen(false);
	};

	const handleStartTask = (taskId: number) => {
		startTaskMutation(taskId);
		setIsDetailSheetOpen(false);
		router.push(`/immersion/${taskId}`);
	};

	const handleAddTask = useCallback(() => {
		setIsCreateSheetOpen(true);
	}, []);

	const handleCloseCreateSheet = () => {
		setIsCreateSheetOpen(false);
	};

	const handleCharacterDialogButtonClick = async () => {
		if (taskType === "instant") {
			setIsLoading(true);
			await router.push(`/immersion/${urgentTaskId}`);
		} else {
			setIsDialogOpen(false);
		}

		setIsLoading(false);
	};

	const handleFailedDialogButtonClick = () => {
		setIsFailedDialogOpen(false);
	};

	const handleServiceEndDialogButtonClick = () => {
		setIsServiceEndDialogOpen(false);
	};

	const handleTabChange = useCallback((tab: "today" | "all") => {
		setActiveTab(tab);
	}, []);

	useEffect(() => {
		if (isDialogOpen && taskType === "instant") {
			router.prefetch(`immersion/${urgentTaskId}`);
		}
	}, [isDialogOpen, router, taskType, urgentTaskId]);

	useEffect(() => {
		if (searchParams.get("dialog") === "success") {
			setIsDialogOpen(true);
		}

		if (searchParams.get("dialog") === "error") {
			setIsFailedDialogOpen(true);
		}

		const taskParam = searchParams.get("task");
		if (taskParam) {
			setTaskName(taskParam);
		}

		const personaParam = searchParams.get("personaName");
		if (personaParam) {
			setPersonaName(personaParam);
		}

		const personaIdParam = searchParams.get("personaId");
		const personaId = personaIdParam
			? Number.parseInt(personaIdParam, 10)
			: undefined;

		if (personaId) {
			setPersonaId(personaId);
		}

		const taskTypeParam = searchParams.get("type");
		if (taskTypeParam) {
			setTaskType(taskTypeParam);
		}

		const taskIdParam = searchParams.get("taskId");
		if (taskIdParam) {
			setUrgentTaskId(Number(taskIdParam));
		}

		if (isDialogOpen) {
			router.replace("/", { scroll: false });
		}
	}, [searchParams, router, isDialogOpen]);

	useEffect(() => {
		if (searchParams.get("tab") === "all") {
			setActiveTab("all");
		} else if (searchParams.get("tab") === "today") {
			setActiveTab("today");
		}
	}, [searchParams]);

	useEffect(() => {
		if (shouldShowServiceEndDialog()) {
			setIsServiceEndDialogOpen(true);
		}
	}, []);

	return (
		<>
			<div className="flex flex-col overflow-hidden bg-background-primary">
				<Header
					activeTab={activeTab}
					numberOfTodayTasks={numberOfTodayTask}
					numberOfAllTasks={numberOfAllTask}
					handleTabChange={handleTabChange}
				/>

				{isPending ? (
					<SpurtyLoader />
				) : (
					<main className="flex-1 overflow-y-auto px-5 pb-40 pt-28 opacity-0 animate-fadeIn">
						{/* 오늘 할일 탭 */}
						{activeTab === "today" && (
							<TodayTaskTabWrapper
								taskType={taskType}
								isTotallyEmpty={isTotallyEmpty}
								hasWeeklyTasksOnly={hasWeeklyTasksOnly}
								hasAllTasksOnly={hasAllTasksOnly}
								hasTodayAndInProgressTasks={hasTodayAndInProgressTasks}
								hasInProgressTasksOnly={hasInProgressTasksOnly}
								hasTodayTasksOnly={hasTodayTasksOnly}
								handleTaskClick={handleTaskClick}
								handleDetailTask={handleDetailTask}
								handleDeleteTask={handleDeleteTask}
							/>
						)}

						{/* 전체 할일 탭 */}
						{activeTab === "all" && (
							<AllTaskTabWrapper
								isAllEmpty={isAllEmpty}
								inProgressTasks={inProgressTasks}
								todayTasks={todayTasks}
								weeklyTasks={weeklyTasks}
								futureTasks={futureTasks}
								onTaskClick={handleTaskClick}
								onDeleteTask={handleDeleteTask}
							/>
						)}
					</main>
				)}

				<Footer onClick={handleAddTask} />
			</div>

			{detailTask && (
				<TaskDetailSheet
					isOpen={isDetailSheetOpen}
					onClose={handleCloseDetailSheet}
					task={detailTask as TaskWithPersona}
					onDelete={handleDeleteTask}
					onStart={handleStartTask}
					setIsDetailSheetOpen={setIsDetailSheetOpen}
				/>
			)}

			<CharacterDialog
				isOpen={isDialogOpen}
				task={taskName}
				taskType={taskType}
				personaName={personaName}
				personaId={personaId}
				isLoading={isLoading}
				onClick={handleCharacterDialogButtonClick}
			/>

			<FailedDialog
				isOpen={isFailedDialogOpen}
				onClick={handleFailedDialogButtonClick}
			/>

			<CreateTaskSheet
				isOpen={isCreateSheetOpen}
				onClose={handleCloseCreateSheet}
			/>

			<ServiceEndDialog
				value={isServiceEndDialogOpen}
				onButtonClick={handleServiceEndDialogButtonClick}
			/>
		</>
	);
};

const HomePage = () => (
	<Suspense>
		<HomePageContent />
	</Suspense>
);

export default HomePage;
