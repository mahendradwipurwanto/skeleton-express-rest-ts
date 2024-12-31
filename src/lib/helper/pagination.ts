export default function MetaPagination(page: number, limit: number, total: number) {
  return {
    current_page: parseInt(page.toString()),
    last_page: Math.ceil(total / limit),
    from: (page - 1) * limit + 1,
    to: Math.min(page * limit, total),
    page: parseInt(page.toString()),
    offset: (page - 1) * limit + 1,
    limit: parseInt(limit.toString()),
    total: total,
  };
}
