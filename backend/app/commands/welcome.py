import click
from app.commands import console


@console.cli.command('welcome')
@click.option('--name',
              help='Your name?', prompt='Your name?', required=True)
def handle(name: str) -> None:
    """Creates new catalog to shopify store."""
    click.echo(click.style(f"Hello {name}. Welcome to flask", fg="blue"))
