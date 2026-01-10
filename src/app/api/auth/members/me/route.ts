import { serverApi } from "@/lib/serverKy";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
	try {
		const userDataCookie = req.cookies.get("user");

		if (userDataCookie) {
			let userData: {
				memberId: number;
				nickname: string;
				email: string;
				profileImageUrl: string;
			} | null = null;

			try {
				userData = JSON.parse(userDataCookie.value);
			} catch (error) {
				console.error("userData 쿠키 파싱 오류:", error);
			}

			if (userData?.nickname && userData.nickname !== "") {
				return NextResponse.json(userData);
			}
		}

		const response = await serverApi.get("v1/members/me");

		if (!response.ok) {
			if (response.status === 404) {
				return NextResponse.json(
					{ error: "사용자 정보를 가져올 수 없습니다." },
					{ status: 404 },
				);
			}
			throw new Error(`API 요청 실패: ${response.status}`);
		}

		const data = await response.json();
		const nextResponse = NextResponse.json(data);

		nextResponse.cookies.set("user", JSON.stringify(data), {
			httpOnly: true,
			secure: true,
			sameSite: "lax",
			path: "/",
			maxAge: 31536000,
		});

		return nextResponse;
	} catch (error) {
		return NextResponse.json(
			{
				error: `사용자 정보를 가져오는 중 에러 발생: ${(error as Error).message || "알 수 없는 오류"}`,
			},
			{
				status:
					(error as Error & { response?: { status: number } }).response
						?.status || 500,
			},
		);
	}
}
