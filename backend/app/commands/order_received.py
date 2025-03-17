from app.commands import console
from app.mailers.order_received import order_received_mailer


@console.cli.command('order:received')
def handle() -> None:
    """Sends first order update after 3 days to customer"""
    order_received_mailer.handle()
