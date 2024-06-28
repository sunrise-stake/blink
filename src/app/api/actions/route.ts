async function GET() {
	return Response.json({ error: "No endpoint specified" }, { status: 400 });
}

export { GET };
